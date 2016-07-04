(function(){

  /**
   * normalize(path)
   *    对路径进行规划化处理, 尽可能消除相对路径. 返回规格化后的路径.
   */
  var normalize = function (src) {
    var des = [], len, top;
    src = src.split(this);
    for (var i=0; i< src.length; i++) {
      var sym = src[i];
      if (len = des.length) {
        if (sym != '.') {
          top = des[len-1];
          if (sym != '..') {
            if(top == '.' && sym)
              des.pop();
            des.push(sym);
          }
          else if (top) {
            if (top == '..') {
              des.push(sym);
            }
            else {
              des.pop();
            }
          }
        }
      }
      else {
        des.push(sym);
      }
    }
    return des.join('/');
  }.bind(
    /\/+/   //reSplit
  );

  var purl = function(url, rel) {
    var ms = url.match(this);
    var origin = ms[1];
    var dir = ms[2];
    var file = ms[3];

    if ( ! origin ) {  //若没有origin, 则是相对的URL
      if(rel){
        ms = rel.match(this);
        origin = ms[1];

        if ( dir[0] != "/" )   //相对目录
          dir = ms[2] + dir;
      }
    }
    dir = normalize(dir);

    return origin + dir + file;

  }.bind(
    /^(https?:\/\/[\w-]+(?:\.[\w-]+)*(?::\d+)?(?=\/)|)(\/?(?:(?:[\w-]+(?:\.[\w-]+)*|\.\.?)\/)*|)([\w-]+(?:\.[\w-]+)*|)(\?[^#]*|)(#.*|)/
    //|1:origin                                      ||2:dir                                   ||3:file             ||4:search|5:hash
  );

  function get(url) {
    var http = new XMLHttpRequest;
    http.open('GET', url, false);
    http.send();
    return http.status / 100 ^ 2 ? '' : http.responseText;
  }

  var reIts = /( *)\/\/its\s*\( *[\n\r]((?:[^\/]|\/(?!\/ *\)))+)\/\/ *\) *;?/g;
  var reCases = /;;\n?/;
  var reThrow = /(\s*)(.*)(\.should(?:\.not)?\.throw\b.*)/;
  var reDone = /\bdone\b/;

  var home = purl(location.toString());

  var script = document.scripts;
  script = script[script.length-1];
  var run = script.getAttribute('run'), url, code;
  if(run) {
    run = run.split(/\s*[,;]\s*|^\s*|\s*$/);
    for(var i=0; i<run.length; i++)
      if(url = run[i]) {
        url = purl(url, home);
        code = get(url);
        code = make(code);
        code += '\n//# sourceURL='+url;
        window.eval(code);
      }
  }

  if(script.hasAttribute('its')) {
    code = make(script.text);
    if(url = script.getAttribute('name')){
      code += '\n//# sourceURL=' + purl(url, home+'/');
    }
    window.eval(code);
  }

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