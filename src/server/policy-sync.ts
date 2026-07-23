import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { PrismaClient } from "@/generated/prisma/client";
import type { PolicySearchItem } from "@/utils/types";

type ParsedPolicy = {
  policyId: string;
  title: string;
  category: string;
  sourcePath: string;
  sections: Array<{ section: string; content: string }>;
};

const policyDirectory = new URL("../data/policies/", import.meta.url);
const policyIndexUrl = new URL("../data/policy-search-index.json", import.meta.url);

const parsePolicyMarkdown = (source: string, sourcePath: string): ParsedPolicy => {
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`${sourcePath}: 정책 frontmatter 형식이 올바르지 않습니다.`);

  const fields = Object.fromEntries(
    match[1].split("\n").flatMap((line) => {
      const separator = line.indexOf(":");
      return separator === -1 ? [] : [[line.slice(0, separator).trim(), line.slice(separator + 1).trim()]];
    })
  );
  if (!fields.policyId || !fields.title || !fields.category) {
    throw new Error(`${sourcePath}: policyId, title, category가 필요합니다.`);
  }

  const body = match[2].replace(/^# .*\n+/, "");
  const sections = [...body.matchAll(/^## (.+)\n([\s\S]*?)(?=^## |$)/gm)].map((section) => ({
    section: section[1].trim(),
    content: section[2].trim().replace(/\n+/g, " "),
  }));
  if (!sections.length) throw new Error(`${sourcePath}: 정책 섹션이 없습니다.`);

  return {
    policyId: fields.policyId,
    title: fields.title,
    category: fields.category,
    sourcePath,
    sections,
  };
};

export async function syncPolicies(prisma: PrismaClient) {
  const index = JSON.parse(await readFile(policyIndexUrl, "utf8")) as PolicySearchItem[];
  const indexByPolicySection = new Map(index.map((item) => [`${item.policyId}:${item.section}`, item]));
  const files = (await readdir(policyDirectory)).filter((file) => file.endsWith(".md"));
  const parsedPolicies = await Promise.all(
    files.map(async (file) => parsePolicyMarkdown(await readFile(new URL(file, policyDirectory), "utf8"), path.posix.join("src/data/policies", file)))
  );

  for (const policy of parsedPolicies) {
    await prisma.policy.upsert({
      where: { policyId: policy.policyId },
      update: { title: policy.title, category: policy.category, sourcePath: policy.sourcePath },
      create: { policyId: policy.policyId, title: policy.title, category: policy.category, sourcePath: policy.sourcePath },
    });
    const sectionIds = new Set<string>();
    for (const section of policy.sections) {
      const metadata = indexByPolicySection.get(`${policy.policyId}:${section.section}`);
      if (!metadata) throw new Error(`${policy.sourcePath}: ${section.section}의 검색 메타데이터가 없습니다.`);
      sectionIds.add(metadata.sectionId);
      await prisma.policySection.upsert({
        where: { sectionId: metadata.sectionId },
        update: { section: section.section, content: section.content, keywords: metadata.keywords, ticketCategories: metadata.ticketCategories, orderStatuses: metadata.orderStatuses, policyId: policy.policyId },
        create: { sectionId: metadata.sectionId, section: section.section, content: section.content, keywords: metadata.keywords, ticketCategories: metadata.ticketCategories, orderStatuses: metadata.orderStatuses, policyId: policy.policyId },
      });
    }
    await prisma.policySection.deleteMany({ where: { policyId: policy.policyId, sectionId: { notIn: [...sectionIds] } } });
  }
  return { policyCount: parsedPolicies.length, sectionCount: index.length };
}
