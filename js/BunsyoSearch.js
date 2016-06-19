function jf_cmb(cmb_name,syozoku_elt,syozoku_val,bunrui_elt,bunrui_val){

	//検索条件を画面に記録（画面遷移時の条件保存に必要）
	document.forms['BunsyoSearch'].elements[syozoku_elt].value = syozoku_val;
	document.forms['BunsyoSearch'].elements[bunrui_elt].value = bunrui_val;
	//document.forms[frm].action = "BunsyoSearch";
	//document.forms[frm].submit();


	//ajaxを用いて、対応するコンボボックスのみを書き換える。
	var cmb_value = document.getElementsByName(cmb_name)[0].value;
	var cmb_nendo = document.getElementsByName("cmb_NENDO")[0].value;
	var cmb_syubetu = document.getElementsByName("cmb_SYUBETU")[0].value;
	var cmb_large = document.getElementsByName("cmb_LARGE")[0].value;
	var session_id = document.getElementsByName("SESSIONID")[0].value;
	var SendData = new Object();

	//送信データの作成
	SendData =
		"method=ajax&"  +
		"SESSIONID="    +session_id+"&"+
		"cmb_name="     +cmb_name+"&"+
		"cmb_value="    +cmb_value+"&"+
	//	"syozoku_elt="  +syozoku_elt+"&"+
		"syozoku_val="  +syozoku_val;
	//	"bunrui_elt="   +bunrui_elt+"&"+
	//	"bunrui_val="   +bunrui_val;

	//文書分類コンボボックスの場合は、自分より上の段階のコンボボックスの値を必要とする
	if(cmb_name == "cmb_MIDDLE")
	{
		SendData +=
			"&cmb_nendo="  +cmb_nendo+"&"+
			"cmb_syubetu=" +cmb_syubetu+"&"+
			"cmb_large="   +cmb_large;
	}
	else if(cmb_name == "cmb_LARGE")
	{
		SendData +=
			"&cmb_nendo="  +cmb_nendo+"&"+
			"cmb_syubetu=" +cmb_syubetu;
	}
	else if(cmb_name == "cmb_SYUBETU")
	{
		SendData +=
			"&cmb_nendo="  +cmb_nendo;
	}

	var xmlHttp = null;
	if(window.XMLHttpRequest)
	{
		xmlHttp = new XMLHttpRequest();
	}
	else
	{//IE6とIE7の場合
		if(windows.ActiveXObject)
		{
			xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
		}
		else
		{
			xmlHttp = null;
		}
	}

	if(null == xmlHttp )
	{// 初期化失敗時
		return ;
	}

	//応答時の処理定義
	xmlHttp.onreadystatechange = function ()
	{
		if(xmlHttp.readyState == 4 && xmlHttp.status == 200)
		{//応答成功時コンボボックスを作り直し
			create_combo_boxes(xmlHttp.responseText , cmb_name);
		}
	};

	xmlHttp.open("POST" , "../cgi-bin/BunsyoSearch.cgi" , true);
	xmlHttp.setRequestHeader("content-type",
      "application/x-www-form-urlencoded");
	encodeURIComponent(SendData).replace(/%20/g,'+');
	xmlHttp.send(SendData);

}

/*  function create_combo_boxes(response , cmb_name)
	サーバからのajax通信の応答をもとに、指定コンボボックスの値を書き換える。
	response ---ajax通信から受けとったサーバの応答でコンボボックスに入れる値
	cmb_name ---onchangeイベントを発生させたコンボボックスのname
*/
function create_combo_boxes(response , cmb_name)
{
	if(response == "E001")
	{
		var ele = document.createElement('input');
		ele.setAttribute('type', 'hidden');
		ele.setAttribute('name' , 'ErrorCode');
		ele.setAttribute('value' , 'true');
		document.forms['BunsyoSearch'].appendChild(ele);
		document.forms['BunsyoSearch'].action = "../cgi-bin/BunsyoSearch.cgi";
		document.forms['BunsyoSearch'].submit();
	}

	//responseはカンマ区切りで、二つで一組のデータ
	// 奇数番目 コンボボックスのvalue
	// 偶数番目 コンボボックスの表示テキスト
	var value = response.split(",");
	var obj = null;

	//分類コンボボックス削除処理（これはresponseがどんなでも必ず行う）
	if(cmb_name == "cmb_KYOKU" || cmb_name == "cmb_BU")
	{//cmb_KYOKU変更時->cmb_BUを作り直し、cmb_KAはいずれにせよ消去
	//cmb_BU変更時->cmb_BUを作り直し
		obj = delete_all_child("cmb_KA");
		if( cmb_name == "cmb_KYOKU")
		{
			//cmb_BUも書き換え前に消去
			obj = delete_all_child("cmb_BU");
		}
	}
	//分類コンボボックスを書き換える時の処理
	else if(cmb_name == "cmb_NENDO" || cmb_name == "cmb_SYUBETU" ||
			cmb_name == "cmb_LARGE" || cmb_name == "cmb_MIDDLE")
	{
		obj = delete_all_child("cmb_SMALL");

		if(cmb_name == "cmb_LARGE")
		{
			obj = delete_all_child("cmb_MIDDLE");
		}
		else if(cmb_name == "cmb_SYUBETU")
		{
			obj = delete_all_child("cmb_MIDDLE");
			obj = delete_all_child("cmb_LARGE");
		}
		else if(cmb_name == "cmb_NENDO")
		{
			obj = delete_all_child("cmb_MIDDLE");
			obj = delete_all_child("cmb_LARGE");
			obj = delete_all_child("cmb_SYUBETU");
		}
	}

	//サーバからの応答が空だったらデータは挿入しない。
	if(value.length < 2)
	{
		return ;
	}

	//データ挿入
	var objOption = obj.options;
	for(var i = 0 ; i < value.length ;i+=2)
	{
		objOption = document.createElement( "option" );
		objOption.setAttribute("value", value[i]);
		objOption.appendChild(document.createTextNode(value[i+1]));
		obj.appendChild(objOption);
	}
}

//cmb_nameないのオプション全部消す
function delete_all_child(cmb_name)
{
	var obj = document.forms["BunsyoSearch"].elements[cmb_name];
	var objOptions = obj.options;
	while (objOptions.length > 1)
	{
		objOptions[objOptions.length-1] = null;
	}
	//挿入オプションの候補として返す
	return obj;
}



function jf_clear()
{
	clearForm(document.forms[0]);
	//Form.reset(forms[0]);
	//document.BunsyoSearch.MODE.value = "clear";
	//document.BunsyoSearch.action = "../cgi-bin/BunsyoSearch.cgi";
	//document.BunsyoSearch.submit();
}
function clearForm(form) {
    for(var i=0; i<form.elements.length; ++i) {
        clearElement(form.elements[i]);
    }
}
function clearElement(element) {
    switch(element.type) {
        case "text":
            element.value = "";
        case "select-one":
            if(element.id=="sgen" || element.id=="egen"){
            	element.value = "平成";
            } else if(element.id=="kensu") {
              element.value = "10"
            } else {
              element.value = "";
            }
        case "radio":
            if(element.id=="hoyuka" || element.id=="ascend"){
            	element.checked = true;
            }else{
              element.checked = false;
            }
        default:
    }
}
function jf_cmbKyouran(val)
{
	if (val == 'S_NENGOU')
	{
		document.BunsyoSearch.SYDATE.value = "";
		document.BunsyoSearch.SMDATE.value = "";
	}
	else if (val == 'SYDATE')
	{
		document.BunsyoSearch.SMDATE.value = "";
	}
	else if (val == 'E_NENGOU')
	{
		document.BunsyoSearch.EYDATE.value = "";
		document.BunsyoSearch.EMDATE.value = "";
	}
	else if (val == 'EYDATE')
	{
		document.BunsyoSearch.EMDATE.value = "";
	}
	document.BunsyoSearch.action = "../cgi-bin/BunsyoSearch.cgi";
	document.BunsyoSearch.submit();
}
