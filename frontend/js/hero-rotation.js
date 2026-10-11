// Hero image deterministic cyclic rotation (1 → 2 → 3 → 1...)
(function() {
    const heroImages = [
        {
            src: 'img/hero_candidate_dog_cat_sunlight.webp',
            alt: 'Cachorro e gato vira-latas sentados juntos ao ar livre sob luz solar natural, representando os animais resgatados pela Adota Patos'
        },
        {
            src: 'img/hero_candidate_dog_cat_closeup.webp',
            alt: 'Cachorro e gato vira-latas sentados juntos em close-up, demonstrando carinho e proximidade entre os animais resgatados'
        },
        {
            src: 'img/hero_candidate_dog_cat_puppy.webp',
            alt: 'Filhote de cachorro e gato vira-latas juntos em deck de madeira ao ar livre, representando a adoção responsável'
        }
    ];

    const STORAGE_KEY = 'adota-patos-hero-index';

    function getNextIndex() {
        let lastIndex = parseInt(localStorage.getItem(STORAGE_KEY), 10);
        if (Number.isNaN(lastIndex) || lastIndex < 0 || lastIndex >= heroImages.length) {
            lastIndex = -1; // First visit will become index 0
        }
        const nextIndex = (lastIndex + 1) % heroImages.length;
        localStorage.setItem(STORAGE_KEY, String(nextIndex));
        return nextIndex;
    }

    function setHeroImage() {
        const index = getNextIndex();
        const selected = heroImages[index];
        const heroImg = document.getElementById('hero-img');
        if (heroImg) {
            heroImg.src = selected.src;
            heroImg.alt = selected.alt;
            heroImg.classList.remove('hero-img-hidden');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setHeroImage);
    } else {
        setHeroImage();
    }
})();