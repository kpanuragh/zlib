var zlib=require('./index.js');
zlib.gzip('Hello, world!', function (error, result) {
   if (error) throw error;
     console.log(result);
})