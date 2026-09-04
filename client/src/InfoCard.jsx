export default function InfoCard({ item }) {
  // If spritePath isn't defined, we'll just show a placeholder box
  const hasImage = !!item.spritePath;
  const isSheet = hasImage && item.spriteColumns && item.spriteRows;

  return (
    <article className="info-item-card">
      <div className="info-item-card__image-wrap">
        {isSheet ? (
          <div
            role="img"
            aria-label={item.name}
            className="info-item-card__image info-item-card__image--sheet"
            style={{
              backgroundImage: `url(${item.spritePath})`,
              '--sprite-columns': item.spriteColumns,
              '--sprite-rows': item.spriteRows,
              ...(item.spriteAspect && { '--sprite-aspect': item.spriteAspect })
            }}
          />
        ) : hasImage ? (
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
