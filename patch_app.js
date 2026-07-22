const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `useEffect(() => {
   if (window.location.pathname === "/admin") {
     
       window.history.replaceState(null, "", "/");
   }
 }, []);`,
  `useEffect(() => {
   if (window.location.pathname === "/admin") {
     loginWithGoogle().then(() => {
       window.history.replaceState(null, "", "/");
     }).catch(err => {
       console.error(err);
       window.history.replaceState(null, "", "/");
     });
   }
 }, []);`
);

fs.writeFileSync('src/App.tsx', code);
