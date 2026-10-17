"""Collect Wikimedia Commons reference photos with per-file attribution.
No image content is modified; uses Commons-provided display thumbnails.
Run intentionally, not from app user requests. Does not infer identities or ages.
"""
import urllib.request,urllib.parse,json,re,html,concurrent.futures,pathlib,time
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'tmp/photo-candidates';OUT.mkdir(parents=True,exist_ok=True)
HEAD={'User-Agent':'DogsLifePrototype/0.7 (educational image-reference collection; low-concurrency)'}
queries={'지역 믹스':'intitle:mongrel','진돗개 믹스':'intitle:Jindo dog','푸들':'intitle:poodle','시바 믹스':'intitle:"Shiba Inu"','인디언 파리아 타입':'intitle:"Indian pariah"','래브라도 믹스':'intitle:"Labrador retriever"','테리어 믹스':'intitle:"Jack Russell"','셰퍼드 믹스':'intitle:"German Shepherd"','소형 믹스':'intitle:"Chihuahua mix"','허스키 믹스':'intitle:"Siberian Husky"'}
def fetch(url):
 with urllib.request.urlopen(urllib.request.Request(url,headers=HEAD),timeout=25)as r:return r.read(),r.headers.get('Content-Type','')
def text(s):return html.unescape(re.sub('<[^>]+>','',s or'')).strip()
def search(item):
 breed,q=item
 params={'action':'query','generator':'search','gsrsearch':q+' filetype:bitmap -heart -skeleton -anatomy -painting -drawing -statue -logo -skull -taxidermy -sarcophagus -monument -wearing -Malinois','gsrnamespace':6,'gsrlimit':12,'prop':'imageinfo','iiprop':'url|extmetadata|size','iiurlwidth':900,'format':'json'}
 try:data=json.loads(fetch('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(params))[0])
 except Exception as e:return breed,[],str(e)
 result=[]
 for p in sorted(data.get('query',{}).get('pages',{}).values(),key=lambda p:p.get('index',999)):
  if not p.get('imageinfo'):continue
  i=p['imageinfo'][0];m=i.get('extmetadata',{});val=lambda k:m.get(k,{}).get('value','');license=text(val('LicenseShortName'));author=text(val('Artist'))
  if not re.match(r'^(CC BY(?:-SA)? [1-4]\.0|CC0|Public domain)',license):continue
  if re.search('contact me before commercial|non.?commercial',author,re.I):continue
  if i.get('width',0)<350 or i.get('height',0)<250:continue
  url=i.get('thumburl') or i['url'];ext='.png' if '.png' in url.lower().split('?')[0] else '.jpg';name=f'commons-{p["pageid"]}{ext}'
  result.append({'id':str(p['pageid']),'breed':breed,'title':p['title'],'url':'assets/photos/'+name,'downloadUrl':url,'source':i['descriptionurl'],'originalUrl':i['url'],'author':author,'license':license,'licenseUrl':val('LicenseUrl'),'attributionRequired':val('AttributionRequired'),'retrieved':'2026-10-16','age':'unknown','kind':'breed-reference','reviewed':False})
 return breed,result,None
def download(x):
 try:
  path=OUT/pathlib.Path(x['url']).name
  if not path.exists():
   b,ct=fetch(x['downloadUrl'])
   if len(b)>8_000_000 or not ct.startswith('image/'):return None
   path.write_bytes(b)
  if path.stat().st_size<2000:return None
  return x
 except Exception as e:return None
allphotos=[];errors=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=3)as pool:
 for breed,rows,error in pool.map(search,queries.items()):
  print('SEARCH',breed,len(rows),error or'',flush=True)
  if error:errors.append({'breed':breed,'error':error})
  # Keep at most 8 candidates per breed for visual review before serving.
  allphotos.extend(rows[:8])
with concurrent.futures.ThreadPoolExecutor(max_workers=3)as pool:photos=[x for x in pool.map(download,allphotos)if x]
(ROOT/'photo-candidates.json').write_text(json.dumps({'photos':photos,'errors':errors},ensure_ascii=False,indent=2))
print('DOWNLOADED',len(photos),flush=True)
for breed in queries:print('COUNT',breed,sum(x['breed']==breed for x in photos),flush=True)
