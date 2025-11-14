gsap.registerPlugin(ScrollTrigger);

// animações iniciais
gsap.from(".hero h1", { y: 50, opacity: 0, duration: 1 });
gsap.from(".hero p", { y: 30, opacity: 0, duration: 1, delay: 0.3 });
gsap.fromTo(".btn-explore",
  { opacity: 0, scale: 0.8 },
  { opacity: 1, scale: 1, duration: 0.3, delay: 0.5, ease: "power2.out" }
);


// vídeo da descrição se move com o scroll
gsap.to(".descricao-video video", {
  scrollTrigger: {
    trigger: ".descricao",
    start: "top top",
    end: "bottom bottom",
    scrub: true
  },
  yPercent: 40,
  ease: "none"
});
