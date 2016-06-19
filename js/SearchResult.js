function jf_sort(sort, key){
	document.SearchResult.SORT.value = sort;
	document.SearchResult.SORTKEY.value = key;
	document.SearchResult.PAGENUM.value = "1";
	document.SearchResult.MODE.value = "sort";
	document.SearchResult.submit();
}
function jf_cmbKensu(){
	document.SearchResult.PAGENUM.value = "1";
	document.SearchResult.MODE.value = "kensuCmb";
	document.SearchResult.submit();
}
function jf_detailDisp(num){
	document.forms["SearchResult"].elements["DISPNUM"].value = num;
	document.forms["SearchResult"].elements["MODE"].value = "DispDetail";
	document.forms["SearchResult"].submit();
}
