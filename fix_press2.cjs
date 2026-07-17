const fs = require('fs');
let code = fs.readFileSync('src/components/PressSection.tsx', 'utf8');

// The lines at the bottom:
//                   </div>
//               </div>
//             )
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

const toReplace = `                  </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}`;

const replaceWith = `                  </div>
                )}
              </div>
            )
          )}
        </div>
    </div>
  );
}`;

code = code.replace(toReplace, replaceWith);
fs.writeFileSync('src/components/PressSection.tsx', code);
