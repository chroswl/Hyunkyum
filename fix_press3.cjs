const fs = require('fs');
let code = fs.readFileSync('src/components/PressSection.tsx', 'utf8');

// The problematic block is around line 390.
// Let's replace the last 200 characters with exactly what we want.
let parts = code.split('</button>');
// the last button is the right chevron
// parts.length - 1 is the part after the last button

let theEnd = `
                  </div>
                )}
              </div>
            )
          )}
        </div>
    </div>
  );
}`;

let newCode = parts.slice(0, -1).join('</button>') + '</button>' + theEnd;

fs.writeFileSync('src/components/PressSection.tsx', newCode);
