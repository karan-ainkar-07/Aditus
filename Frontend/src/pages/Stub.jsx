export default function Stub({ title, text }) {
  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-[15px] text-muted">{text}</p>
    </div>
  );
}