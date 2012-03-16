this.size = l[j].length - firstSize
this.idx = j
res = i - offset
// Reduce the scope of the pattern search
s = s.substr(offset, res)
offset = 0