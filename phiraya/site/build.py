# Builds the self-contained site/index.html from site/src.html by inlining fonts and portraits.
# Usage: python3 site/build.py site
import base64,sys,os
d=sys.argv[1]
s=open(os.path.join(d,'src.html')).read()
for k,f in (('__CORMORANT__','cormorant.woff2'),('__INTER__','inter.woff2')):
    s=s.replace(k,base64.b64encode(open(os.path.join(d,'assets/fonts',f),'rb').read()).decode())
open(os.path.join(d,'index.html'),'w').write(s)
print(len(s))
s=open(os.path.join(d,'index.html')).read()
MIME={'webp':'image/webp','jpg':'image/jpeg','mp4':'video/mp4','mp3':'audio/mpeg'}
for k,f in (('__STANDING__','phiraya-standing.webp'),('__AVATAR__','phiraya-avatar.webp'),('__IVORY__','phiraya-ivory.webp'),('__FULL__','phiraya-full.webp'),('__CLOSEUP__','phiraya-closeup.webp'),
            ('__CALLVIDEO__','call-demo.mp4'),('__CALLPOSTER__','call-poster.jpg'),('__CALLVOICE__','call-voice.mp3')):
    s=s.replace(k,'data:'+MIME[f.rsplit('.',1)[1]]+';base64,'+base64.b64encode(open(os.path.join(d,'assets',f),'rb').read()).decode())
open(os.path.join(d,'index.html'),'w').write(s); print('with images',len(s))
