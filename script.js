// Example JavaScript for additional features like hover effects or dynamic content loading
document.addEventListener('DOMContentLoaded', () => {
    const animeCards = document.querySelectorAll('.anime-card');

    animeCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'scale(1.05)';
            card.style.transition = 'transform 0.3s';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'scale(1)';
        });
    });
});
