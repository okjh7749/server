var myString = '#Hello#ert 1 #word. #Sentence number 2.';
var matches = [];
var i = 0;
splits = myString.split(/(#[^#\s]+)/g).map(v => {
    if (v.match(/#/g)) {
        matches[i++] = v;
    }
    return v;
});

for (tag in matches) {
    console.log(matches[tag]);
}
