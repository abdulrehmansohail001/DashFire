export default function InfoCard({ item }) {
  // If spritePath isn't defined, we'll just show a placeholder box
  const hasImage = !!item.spritePath;

  return (
    <article className="info-item-card">
      <div className="info-item-card__image-wrap">
        {hasImage ? (
          <img src={item.spritePath} alt={item.name} className="info-item-card__image" />
        ) : (
          <div style={{ color: '#000', fontSize: '2rem' }}>?</div>
        )}
      </div>
      <h2>{item.name}</h2>
      <p className="info-item-card__world">
        {item.world}
      </p>
      <div className="info-item-card__effect">
        <strong>EFFECT:</strong> {item.specialEffect}
      </div>
      <p className="info-item-card__desc">
        {item.description}
      </p>
    </article>
  );
}
