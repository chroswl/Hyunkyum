import { useEffect } from 'react';
import { Language } from '../types';

const seoData = {
  EN: {
    title: "Hyunkyum Kim (바리톤 김현겸) | Baritone & Opera Singer",
    description: "Official website of Hyunkyum Kim, a South Korean baritone and ensemble member of Pfalztheater Kaiserslautern. Explore his biography, repertoire, and schedule.",
  },
  DE: {
    title: "Hyunkyum Kim (바리톤 김현겸) | Bariton & Opernsänger",
    description: "Offizielle Website von Hyunkyum Kim, südkoreanischer Bariton und Ensemblemitglied am Pfalztheater Kaiserslautern. Entdecken Sie Biografie und Termine.",
  },
  KO: {
    title: "김현겸 (Hyunkyum Kim) | 바리톤 & 오페라 가수",
    description: "독일 카이저슬라우테른 팔츠 극장(Pfalztheater Kaiserslautern) 전속 솔리스트 바리톤 김현겸의 공식 웹사이트입니다. 그의 오페라 연주 영상, 공연 일정, 레퍼토리 및 갤러리를 확인해보세요.",
  }
};

export function useSEO(currentLang: Language) {
  useEffect(() => {
    const { title, description } = seoData[currentLang];

    // Update <html lang="...">
    document.documentElement.lang = currentLang.toLowerCase();

    // Update <title>
    document.title = title;

    // Update <meta name="description">
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', description);

    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);

    // Update Twitter Card tags
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', title);

    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', description);

    // Update JSON-LD
    const jsonLdScript = document.getElementById('json-ld-data');
    if (jsonLdScript) {
      try {
        const jsonLd = JSON.parse(jsonLdScript.textContent || '[]');
        if (jsonLd.length >= 2) {
          jsonLd[0].name = title;
          jsonLd[1].description = description;
          jsonLdScript.textContent = JSON.stringify(jsonLd);
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [currentLang]);
}
