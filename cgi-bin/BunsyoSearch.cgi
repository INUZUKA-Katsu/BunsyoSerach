#!/usr/bin/ruby

require 'cgi'
require 'uri'
require 'net/http'
require 'kconv'

def debug(str)
  print "Content-Type: text/html\n\n"
  print "<html>"
  print "<h1>Debug!</h1>"
  print str.kconv(Kconv::SJIS,Kconv::UTF8)
  print "</html>"
  exit
end

#各画面に対応するテンプレートファイルを返すメソッド
def template(gamen)
  case gamen
  when :get_search
    "../bunsyo/JTemplate_BunsyoSearch_get.html"
  when :post_search
    "../bunsyo/JTemplate_BunsyoSearch_post.html"
  when :result
    "../bunsyo/JTemplate_Searchresult_Ajax.html"
  when :detail
    "../bunsyo/JTemplate_BunsyoSyosai.html"
  when :error
    "../bunsyo/JTemplate_Error.html"
  else
    "Ther is not my_gamen(html)."
  end
end

def get_uri(request_gamen)
  common = 'http://drweb.city.yokohama.lg.jp/yads/servlet/'
  case request_gamen
  when  :get_search,:post_search,:ajax
      URI.parse(common+"BunsyoSearch")
  else
      URI.parse(common+"SearchResult")
  end
end


#POSTリクエストデータをエンコードするメソッド
#ruby1.8で,URI.encodeが使えない場合に使用。
def encode(url)
  ret = ''
  url.split(//).each { |ch|
    if ch.size != 1
      ch.bytes.each { |ch|
        ret.concat sprintf("%%%02x", ch)
      }
    else
      ret.concat ch[0]
    end
  }
  return ret
end

#フォーム画面からのリクエストをサーブレットに中継する処理を行うためのクラス
class ResultHtml
  attr_reader :body, :returned_gamen
  def initialize(cgi)
    @cgi=cgi
    @request_gamen=request_gamen(cgi)
    @uri=get_uri(@request_gamen)
    @body=response_to_request
    @returned_gamen=distinguish_returned_gamen(@request_gamen,@body)
  end
  private
  #ブラウザからのPOSTリクエストデータから、要求画面を特定するメソッド。
  def request_gamen(cgi)
    $my||=
    if    cgi==nil                                          or
          cgi.params=={}                                    or
          cgi.params['MODE']          ==['clear']           or
          cgi.params['btnBACK']       ==['戻る']
      :get_search
    elsif cgi.params['ToBunsyoSearch']==['条件入力画面に戻る']
      :post_search
    elsif cgi.params['search']        ==['検索']             or
          cgi.params['btnSEARCH']     ==['絞込み検索']        or
          cgi.params['btnPREV']       ==['前頁']             or
          cgi.params['btnNEXT']       ==['次頁']             or
          cgi.params['MODE']          ==['kensuCmb']        or
          cgi.params['MODE']          ==['sort']            or
          cgi.params['btnSearchBack'] ==['検索結果一覧に戻る']
      :result
    elsif cgi.params['MODE']          ==['DispDetail']
      :detail
    elsif cgi.params['ErrorCode']     ==['true']
      :error
    elsif cgi.params['method']        ==['ajax']
      :ajax
    end
  end
  def response_to_request
    case @request_gamen
    when :get_search  ; get_request
    else              ; post_request
    end
  end
  def get_request
    html=""
    Net::HTTP.version_1_2
    Net::HTTP.start(@uri.host, @uri.port){|http|
      respons = http.get(@uri.path)
      cookie=respons.get_fields('Set-Cookie')
      begin
        #File.write("../cookie/Cookie.txt",cookie[0].split(/;\s*/).join("\n"))
      rescue
        #File.open("../cookie/Cookie.txt","w"){|f| f.print cookie[0].split(/;\s*/).join("\n")}
      end
      html=respons.body.kconv(Kconv::UTF8,Kconv::SJIS)
    }
    html
  end
  def post_request
    html=""
    Net::HTTP.version_1_2
    req = Net::HTTP::Post.new(@uri.path)
    req.body = make_query_str
    req['Cookie']=get_sessionid(:not_use_cookie)
    Net::HTTP.start(@uri.host, @uri.port) {|http|
      respons = http.request(req)
      html=respons.body.kconv(Kconv::UTF8,Kconv::SJIS)
    }
    html
  end
  def make_query_str
    #save_query_str
    #文字列形式のpostデータを作成
    ary=[]
    @cgi.params.each do |k,v|
      if v=="" or v==nil
        s = "#{k}="
      else
        val=hosei(v[0]).kconv(Kconv::SJIS,Kconv::UTF8) #SJISに変換
        begin
          s = "#{k}=#{URI.encode(val)}"
        rescue
          s = "#{k}=#{encode(val)}"
        end
      end
      ary << s
    end
    ary.join("&")
  end
  def save_query_str
    str=""
    @cgi.params.each do |k,v|
      if v=="" or v==nil
        str = str+"¥n#{k}="
      else
        val=v[0].kconv(Kconv::SJIS,Kconv::UTF8) #SJISに変換
        str = str+"\n#{k}=#{val}"
      end
    end
    File.write("/Users/Shared/cgi_params.txt",str)
  end
  def hosei(value)
    return "検索画面へ" if value=="条件入力画面に戻る"
    return "絞込み" if value=="絞込み検索"
    return "前 頁" if value=="前頁"
    return "次 頁" if value=="次頁"
    value
  end
  def get_sessionid(how=:not_use_cookie)
    case how
    when :use_cookie
      File.read("../cookie/Cookie.txt").match(/^.*SESSIONID.*/)[0]
    when :not_use_cookie
      "JSESSIONID="+@cgi.params['SESSIONID'][0]+".yads_001"
    end
  end
  def distinguish_returned_gamen(request_gamen,body)
    return :error if request_gamen==:error
    return :error if body.match(/name="SearchError">/)
    request_gamen
  end
end

#サーブレットから取得した画面データから必要データを切り出す。
class MarkupItems
  attr_reader :data
  def initialize(returned_gamen,returned_html)
    @origin=returned_html
    @data=Hash.new
    @data=get_items(returned_gamen)
  end
  def get_items(returned_gamen)
    data=Hash.new
    case returned_gamen
    when :post_search,:get_search
      data=search_gamen_items
    when :result
      data=result_gamen_items
    when :detail
      data=detail_gamen_items
    when :error
      data=error_gamen_items
    end
    data
  end
  #*****(1)検索条件入力画面からの切り出し*****
  def search_gamen_items
    if ans=@origin.match(/<input.*?SESSION.*?>/)
      data[:hidden_input]=ans[0]
    end
    if ans=@origin.match(/AND_SEARCHKEY.*?value="(.*?)"/)
      data[:keyword1]=ans[1]
    end
    if ans=@origin.match(/OR_SEARCHKEY.*?value="(.*?)"/)
      data[:keyword2]=ans[1]
    end
    ary=["cmb_KYOKU", "cmb_BU", "cmb_KA", "cmb_NENDO", "cmb_SYUBETU", "cmb_LARGE", "cmb_MIDDLE", "cmb_SMALL", "SYDATE", "SMDATE", "EYDATE", "EMDATE", "KENSU"]
    ary.each do |item|
      if ans=@origin.match(/<select[^>]*?name="#{item}".*?((<option.*?>.*?<\/option>)+)/)
        data[item.downcase.to_sym]=ans[1]
      end
    end
    if ans=@origin.match(/<input checked value="(.*?)" name="SORTKEY"/)
      data[ans[1].downcase.to_sym]='checked="checked"'
    end
    if ans=@origin.match(/<input value="(.*?)" name="SORT" type="radio" checked>/)
      data[ans[1].downcase.to_sym]='checked="checked"'
    end
    data
  end
  #*****(2)検索結果画面からの切り出し*****
  def result_gamen_items
    #検索結果からの冒頭の不可視inputタグ列を取得
    if ans=@origin.match(/(<input.*?hidden\">)+/)
      data[:hidden_input]=ans[0].gsub(/<input.*?>/,"\n#{" "*8}"+'\&')
      #puts @data[:hidden_input]
    end
    #検索結果から、上半分のテーブルの情報を取得
    if ans=@origin.match(/<table.*(<table.*?キーワード：AND条件.*?<\/table>)/)
      reg1="<td.*?<td.*?>.*?value=\"(.*?)\"><\/td>.*?" * 2
      reg2="<td.*?<td.*?>(.*?)<\/td>.*?" * 3
      ans2=ans[1].match(/#{reg1+reg2}/)
      data[:disp_andkey]  =ans2[1]
      data[:disp_orkey]   =ans2[2]
      data[:disp_hoyuka]  =ans2[3]
      data[:disp_bunrui]  =ans2[4]
      data[:disp_kyoranbi]=ans2[5]
    end
    #検索結果のヒット件数を知らせるメッセージ文を取得
    if ans=@origin.match(/該当する文書が\d+件見つかりました。最初の\d+件まで閲覧可能です。/)
      data[:result_message]=ans[0]
      #puts ans[0]
    end
    #表示ページ等の表示を取得
    if ans=@origin.match(/<td>(\d+／\d+頁-\[\d+件\])<\/td>/)
      data[:page_num]=ans[1]
      #puts ans[1]
    end
    if ans=@origin.match(/<input.*(<input.*btnPREV.*?>)/)
      data[:btn_prev_page]=ans[1].sub("前 頁","前頁")
      #puts ans[1]
    end
    if ans=@origin.match(/<input.*(<input.*btnNEXT.*?>)/)
      data[:btn_next_page]=ans[1].sub("次 頁","次頁")
      #puts ans[1]
    end
    #検索結果の文書一覧テーブルを取得
    if ans=@origin.match(/<table.*<table.*?<tr>.*?<\/tr>(<tr.*?onClick=\"jf_detailDisp.*hidden\"><\/tr>)/)
      data[:result_table]=ans[1].gsub(/align=\"(center|left)\".*?>/,'class="\1">').
                            gsub(/left(\">(平成|昭和)\d+年度<\/td>)/,'center\1').
                            gsub(/<\/td>(<input.*?>)/,'\1</td>').
                            gsub(/<\/?tr/,"\n#{" "*10}"+'\&').
                            gsub(/<th|<td|<input/,"\n#{" "*12}"+'\&').
                            gsub(/<a/,"\n#{" "*14}"+'\&').
                            gsub(/href="SearchResult"/,'href="../cgi-bin/BunsyoSearch.cgi"')
    end
    if ans=@origin.match(/<select[^>]*?name="KENSU".*?((<option.*?>.*?<\/option>)+)/)
      data[:kensu]=ans[1]
    end
    data
  end
  #*****(3)文書詳細画面からの切り出し*****
  def detail_gamen_items
    ary=%w(文書件名 作成年度 文書番号 第一分類 第二分類 第三分類 第四分類 第五分類 作成課 文書保有課 作成年月日 供覧・決裁完了年月日)
    syms=[:kenmei, :nendo, :bango, :bunrui1, :bunrui2, :bunrui3, :bunrui4, :bunrui5, :sakusei_ka, :hoyu_ka, :sakusei_date, :kyoranbi]
    #文書の各詳細情報を取得
    ary.each_with_index do |item,i|
      if ans=@origin.match(/<table.*#{item}.*?bgcolor="#FFFFFF">(.*?)<\/td/)
        data[syms[i]]=ans[1]
      end
    end
    #不可視inputタグ列を取得
    if ans=@origin.match(/(<input.*?>\s*)+/)
      data[:hidden_input]=ans[0].gsub(/<input.*?>/,"\n#{" "*8}"+'\&')
    end
    data
  end
  #*****(4)エラー画面からの切り出し*****
  def error_gamen_items
    #エラーメッセージを取得
    ans=@origin.match(/<font color="red">(.*?)<\/font>/)
    data[:error_message]=ans[1]
    #不可視inputタグ列を取得
    if ans=@origin.match(/(<input.*?>\s*)+/)
      data[:hidden_input]=ans[0].gsub(/<input.*?>/,"\n#{" "*8}"+'\&')
    end
    data
  end
end


  #*********** ここから実際の処理 ***********

  Dir.chdir(File.dirname(__FILE__))

  #フォーム画面からのリクエストから要求内容を判断。
  if ENV['REQUEST_METHOD']
    cgi = CGI.new(:accept_charset => 'sjis')
  else
    cgi = nil
  end

  #サーブレットにリクエストを送り、戻り値（HTML）を格納。
  HTML=ResultHtml.new(cgi)

  if HTML.returned_gamen==:ajax
    #要求がAjaxデータだった場合はブラウザにサーブレットからのデータそのまま返して終了。
    print "Content-Type: text/html\n\n"
    print HTML.body
  else
  #サーブレットからの戻り値が画面データだった場合はアクセシビリティ対応済み画面に組み替えてブラウザに帰す。

    #まず、サーブレットからの戻り値から必要データを取得してハッシュデータを作成。。
    ITEMS=MarkupItems.new(HTML.returned_gamen,HTML.body)

    #テンプレートファイルを読み込み、UTF8にコード変換。
    Template=File.read(template(HTML.returned_gamen)).kconv(Kconv::UTF8,Kconv::SJIS).
                  sub(/action="(BunsyoSearch|SearchResult)"/,'action="../cgi-bin/BunsyoSearch.cgi"')

    #テンプレートに埋め込まれた <%=(式)%> の部分を探し、
    modified_html=Template.gsub(/<%=(.*?)%>/) do |key|
      if ITEMS.data.key? $1.to_sym
        #式に対応する切り出しデータがあるときは、そのデータに置き換える。
        ITEMS.data[$1.to_sym]
      else
        #対応する切り出しデータがないときはブランクに置き換える。
        ""
      end
    end
    #ブラウザに画面データを返す。
    print "Content-Type: text/html\n\n"
    print modified_html.kconv(Kconv::SJIS,Kconv::UTF8)
  end

