(function(){
  var reIts = /( *)\/\/its\s*\( *[\n\r]((?:[^\/]|\/(?!\/ *\)))+)\/\/ *\) *;?/g;
  var reCases = /;;\n?/;
  var reThrow = /(\s*)(.*)(\.should(?:\.not)?\.throw\b.*)/;
  var reDone = /\bdone\b/;

  var script = document.scripts;
  script = script[script.length-1];
  var code = make(script.text);
  var name;
  if(name = script.getAttribute('name')) {
    code += '\n//# sourceURL='+location.origin+location.pathname+'~'+name;
  }
  window.eval(code);

  function make(code) {
    return code.replace(reIts, function(s, indent, code){
      var tests = [], title, ms, param;
      var cases = code.split(reCases);
      for(var i=0; i<cases.length; i++){
        s = cases[i];
        s = s.replace(/^\s*\n|\s*$/g, "");  //去首尾空行
        title = s.replace(/^\s*|(\s)\s*/g,"$1");    //收缩空白为title
        if(title) {
          title = JSON.stringify(title);
          if(s.trim() == "wait"){
            param = "done";
            s = indent + "setTimeout(done, 0)";
          }
          else if(ms = s.match(reThrow)){
            s = ms[1]+'(function(){'+ms[2]+'})'+ms[3];
            param = '';
          }
          else {
            param = reDone.test(s) ? "done" : "";
          }
          s = s.replace(/^/gm, "  ");    //缩进
          s = indent+"it("+title+", function("+param+"){\n"+s+"\n"+indent+"});";
          tests.push(s);
        }
      }
      s = tests.join("\n\n");
      return s;
    });
  }
})();