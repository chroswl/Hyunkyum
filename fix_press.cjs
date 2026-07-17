const fs = require('fs');
let code = fs.readFileSync('src/components/PressSection.tsx', 'utf8');

code = code.replace(/                  <\/div>\n              <\/div>\n            \)\n          \)\}\n        <\/div>\n      \)\}\n    <\/div>\n  \);\n\}/, 
`                  </div>
                )}
              </div>
            )
          )}
        </div>
    </div>
  );
}`);

fs.writeFileSync('src/components/PressSection.tsx', code);
