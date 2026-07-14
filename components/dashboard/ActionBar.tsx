import styles from "./ActionBar.module.css";

export function ActionBar({
  notice,
  onAction,
}: {
  notice: string;
  onAction: (message: string) => void;
}) {
  return (
    <footer className={`actionbar ${styles.bar}`}>
      <div>{notice && <span className="notice">✓ {notice}</span>}</div>
      <div className="actions">
        <button onClick={() => onAction("답변 초안을 수정할 수 있습니다.")}>수정</button>
        <button className="transfer" onClick={() => onAction("담당자 이관 요청을 등록했습니다.")}>
          담당자 이관
        </button>
        <button
          className="approve"
          onClick={() => onAction("답변을 승인하고 고객에게 발송했습니다.")}
        >
          답변 승인 · 발송 <span>→</span>
        </button>
      </div>
    </footer>
  );
}
