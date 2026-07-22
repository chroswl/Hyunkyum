const fs = require('fs');
let code = fs.readFileSync('src/firebase.ts', 'utf8');

code = code.replace(
  `    } else if (error.code !== 'auth/popup-closed-by-user') {
      alert(\`Login failed: \${error.message || error}\\n\\nIf you are in the AI Studio preview, try opening the app in a new tab.\`);
    }`,
  `    } else if (error.code === 'auth/unauthorized-domain') {
      alert(\`로그인 실패: 이 도메인이 Firebase에 승인되지 않았습니다.\\n\\n[해결 방법]\\n1. Firebase Console에 접속합니다.\\n2. Authentication > Settings (설정) > Authorized domains (승인된 도메인)으로 이동합니다.\\n3. 'Add domain'을 누르고 다음 도메인을 추가하세요:\\n\\n\${window.location.hostname}\\n\\n4. 저장 후 다시 시도해주세요.\`);
    } else if (error.code !== 'auth/popup-closed-by-user') {
      alert(\`로그인 실패: \${error.message || error}\\n\\n에러가 계속되면 새 탭에서 열어서(우측 상단 ↗ 아이콘) 시도해주세요.\`);
    }`
);

fs.writeFileSync('src/firebase.ts', code);
