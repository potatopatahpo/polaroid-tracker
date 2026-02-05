export default function PhotoCard({ polaroid, onClick }) {
    const thumbnailUrl = polaroid.thumbnail
        ? URL.createObjectURL(polaroid.thumbnail)
        : polaroid.imageData;

    return (
        <div className="photo-card" onClick={() => onClick?.(polaroid)}>
            <img src={thumbnailUrl} alt={polaroid.idolName} />
            <div className="overlay">
                <div style={{ fontWeight: 500, color: 'white' }}>{polaroid.idolName}</div>
                <div>{polaroid.groupName}</div>
            </div>
        </div>
    );
}
