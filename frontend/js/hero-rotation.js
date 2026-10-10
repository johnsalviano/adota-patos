// Hero image random rotation
(function() {
    var heroImages = [
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

    function setRandomHeroImage() {
        var randomIndex = Math.floor(Math.random() * heroImages.length);
        var selected = heroImages[randomIndex];
        var heroImg = document.getElementById('hero-img');
        if (heroImg) {
            heroImg.src = selected.src;
            heroImg.alt = selected.alt;
            heroImg.classList.remove('hero-img-hidden');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setRandomHeroImage);
    } else {
        setRandomHeroImage();
    }
})();