import './OutputCard.css';

interface OutputCardProps {
  title: string;
  content: string;
  animationDelay: number;
}

function OutputCard({ title, content, animationDelay }: OutputCardProps) {
  return (
    <article
      className="output-card"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <h2 className="output-card__title">{title}</h2>
      <div className="output-card__content">
        {content.split('\n').map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return null;
          return <p key={i} className="output-card__line">{trimmed}</p>;
        })}
      </div>
    </article>
  );
}

export default OutputCard;
