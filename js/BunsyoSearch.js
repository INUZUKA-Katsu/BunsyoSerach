function jf_cmb(cmb_name,syozoku_elt,syozoku_val,bunrui_elt,bunrui_val){

	//������������ʂɋL�^�i��ʑJ�ڎ��̏����ۑ��ɕK�v�j
	document.forms['BunsyoSearch'].elements[syozoku_elt].value = syozoku_val;
	document.forms['BunsyoSearch'].elements[bunrui_elt].value = bunrui_val;
	//document.forms[frm].action = "BunsyoSearch";
	//document.forms[frm].submit();


	//ajax��p���āA�Ή�����R���{�{�b�N�X�݂̂�����������B
	var cmb_value = document.getElementsByName(cmb_name)[0].value;
	var cmb_nendo = document.getElementsByName("cmb_NENDO")[0].value;
	var cmb_syubetu = document.getElementsByName("cmb_SYUBETU")[0].value;
	var cmb_large = document.getElementsByName("cmb_LARGE")[0].value;
	var session_id = document.getElementsByName("SESSIONID")[0].value;
	var SendData = new Object();

	//���M�f�[�^�̍쐬
	SendData =
		"method=ajax&"  +
		"SESSIONID="    +session_id+"&"+
		"cmb_name="     +cmb_name+"&"+
		"cmb_value="    +cmb_value+"&"+
	//	"syozoku_elt="  +syozoku_elt+"&"+
		"syozoku_val="  +syozoku_val;
	//	"bunrui_elt="   +bunrui_elt+"&"+
	//	"bunrui_val="   +bunrui_val;

	//�������ރR���{�{�b�N�X�̏ꍇ�́A��������̒i�K�̃R���{�{�b�N�X�̒l��K�v�Ƃ���
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
	{//IE6��IE7�̏ꍇ
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
	{// ���������s��
		return ;
	}

	//�������̏�����`
	xmlHttp.onreadystatechange = function ()
	{
		if(xmlHttp.readyState == 4 && xmlHttp.status == 200)
		{//�����������R���{�{�b�N�X����蒼��
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
	�T�[�o�����ajax�ʐM�̉��������ƂɁA�w��R���{�{�b�N�X�̒l������������B
	response ---ajax�ʐM����󂯂Ƃ����T�[�o�̉����ŃR���{�{�b�N�X�ɓ����l
	cmb_name ---onchange�C�x���g�𔭐��������R���{�{�b�N�X��name
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

	//response�̓J���}��؂�ŁA��ň�g�̃f�[�^
	// ��Ԗ� �R���{�{�b�N�X��value
	// �����Ԗ� �R���{�{�b�N�X�̕\���e�L�X�g
	var value = response.split(",");
	var obj = null;

	//���ރR���{�{�b�N�X�폜�����i�����response���ǂ�Ȃł��K���s���j
	if(cmb_name == "cmb_KYOKU" || cmb_name == "cmb_BU")
	{//cmb_KYOKU�ύX��->cmb_BU����蒼���Acmb_KA�͂�����ɂ������
	//cmb_BU�ύX��->cmb_BU����蒼��
		obj = delete_all_child("cmb_KA");
		if( cmb_name == "cmb_KYOKU")
		{
			//cmb_BU�����������O�ɏ���
			obj = delete_all_child("cmb_BU");
		}
	}
	//���ރR���{�{�b�N�X�����������鎞�̏���
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

	//�T�[�o����̉������󂾂�����f�[�^�͑}�����Ȃ��B
	if(value.length < 2)
	{
		return ;
	}

	//�f�[�^�}��
	var objOption = obj.options;
	for(var i = 0 ; i < value.length ;i+=2)
	{
		objOption = document.createElement( "option" );
		objOption.setAttribute("value", value[i]);
		objOption.appendChild(document.createTextNode(value[i+1]));
		obj.appendChild(objOption);
	}
}

//cmb_name�Ȃ��̃I�v�V�����S������
function delete_all_child(cmb_name)
{
	var obj = document.forms["BunsyoSearch"].elements[cmb_name];
	var objOptions = obj.options;
	while (objOptions.length > 1)
	{
		objOptions[objOptions.length-1] = null;
	}
	//�}���I�v�V�����̌��Ƃ��ĕԂ�
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
            	element.value = "����";
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
