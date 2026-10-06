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
for k,f in (('__STANDING__','phiraya-standing.webp'),('__AVATAR__','phiraya-avatar.webp')):
    s=s.replace(k,'data:image/webp;base64,'+base64.b64encode(open(os.path.join(d,'assets',f),'rb').read()).decode())
open(os.path.join(d,'index.html'),'w').write(s); print('with images',len(s))
