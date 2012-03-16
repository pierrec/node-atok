// i: index to start at
// s: string to check
//=>provide an if condition
// Check escaped pattern - '\\'.charCodeAt(0) === 92
for (var esc_i = i, esc_num = 0; esc_i > 0 && s.charCodeAt(--esc_i) === this.esc; esc_num++) {}
if ( (esc_num % 2) === 0 )