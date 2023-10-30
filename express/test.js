let arr = ["asdf", ["asdf", ["asdf"]]];
console.log(Infinity);
console.log(typeof Infinity);
console.log(arr.flat(Infinity));
//[ 'asdf', 'asdf', 'asdf' ]
{
  const Infinity = 1;
  console.log(arr.flat(Infinity));
  //[ 'asdf', 'asdf', [ 'asdf' ] ]
}
