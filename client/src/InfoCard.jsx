import { useMascot } from './context/MascotContext';

export default function InfoCard({ item }) {
  const { flyTo, flyHome } = useMascot();
  const hasImage = !!item.spritePath;
  const isSheet = hasImage && item.spriteColumns && item.spriteRows;

  const handleEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const effectText = `EFFECT: ${item.specialEffect || 'None'}`;
    const messages = item.description ? [item.description, effectText] : [effectText];
    flyTo(item.id, rect, messages);
  };
  
  const handleLeave = () => flyHome(item.id);

  return (
    <article 
      className="info-item-card"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
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
    </article>
  );
}
