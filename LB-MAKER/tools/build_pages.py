#!/usr/bin/env python3
"""Rebuild LB-MAKER thumbnails + data/pages.json from assets/company-profiles.pdf.
Needs poppler (pdftoppm, pdftotext) and ImageMagick (convert)."""
import json, os, re, subprocess, tempfile
R = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
PDF = os.path.join(R, 'assets/company-profiles.pdf')
TITLES = {1:'Cover',2:'Section: Team',3:'Company Chart',4:'About The Brown Studio',5:'Section: Design Studio',
6:'Lindsay Brown',7:'Rory Brown',8:'We Are North County',9:'We Are Local In Many Areas',10:'Section: Construction',
11:'Brown Bag Builders',12:'The Foundry (intro)',13:'The Foundry',14:'Section: Retail',15:'SOTA',16:'Section: Work Samples',
17:'4 Seasons',18:'260 Broadway',19:'Clearview',20:'Neptune 1316',21:'Miradoro',22:'Basecamp',23:'Freewyld',24:'SHFT Hotel',
25:'Carson Master Plan / Urban Surf Resort',26:'Chamonix',27:'Hotel 101',28:'Hygeia Lot 3',29:'La Costa Hotel',30:'Rue Adriane',
31:'Burgundy 2',32:'4th St',33:'Moonlight Bluff 1',34:'Moonlight Bluff 2',35:'Sanford SFR',36:'Andrew 241',37:'Tamarack',
38:'Church',39:'Grays Crossing',40:'St. Croix Residence',41:'Wood Dr.',42:'Mammoth MF',43:'Moab ADU',44:'Summit (Cardiff)',
45:'Sheridan 2054',46:'The Palisades (1)',47:'The Palisades (2)',48:'The Palisades (3)',49:'Summit (Squaw Valley) (1)',
50:'Summit (Squaw Valley) (2)',51:'Mountainside',52:'Passiflora',53:'Rancho Diegueño',54:'Summit - Lot 2',55:'Sanford MF',
56:'Santa Fe',57:'Summit Cardiff',58:'Thank You'}
def section(n):
    if n<=2: return 'Cover'
    if n<=4: return 'Company'
    if n<=9: return 'Design Studio'
    if n<=13: return 'Construction'
    if n<=15: return 'Retail'
    if n==58: return 'Closing'
    return 'Work Samples'
tmp = tempfile.mkdtemp()
subprocess.run(['pdftoppm','-r','100','-jpeg','-jpegopt','quality=90',PDF,tmp+'/f'],check=True)
for r,d,q in ((30,'thumbs',55),(75,'preview',62)):
    subprocess.run(['pdftoppm','-r',str(r),'-jpeg','-jpegopt','quality=%d'%q,PDF,tmp+'/'+d],check=True)
html = subprocess.run(['pdftotext','-bbox-layout',PDF,'-'],capture_output=True,text=True).stdout
pages = html.split('<page ')[1:]
out=[]
for i,p in enumerate(pages,1):
    for d in ('thumbs','preview'):
        os.replace('%s/%s-%02d.jpg'%(tmp,d,i), os.path.join(R,'assets',d,'%02d.jpg'%i))
    words = re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</word>',p)
    num = next(((float(a),float(b),float(c),float(e)) for a,b,c,e,t in words if t==str(i) and float(b)>700),None)
    item={'n':i,'title':TITLES[i],'section':section(i)}
    if num:
        x0,y0,x1,y1=num
        px=100/72
        sx=max(0,int((x0-6)*px)); sy=int(((y0+y1)/2)*px)
        col=subprocess.run(['convert','%s/f-%02d.jpg'%(tmp,i),'-crop','3x3+%d+%d'%(sx-1,sy-1),'-scale','1x1!','-format','%[hex:p{0,0}]','info:'],capture_output=True,text=True).stdout.strip()
        item['num']={'x0':x0,'y0':y0,'x1':x1,'y1':y1,'bg':'#'+col[:6]}
    out.append(item)
json.dump(out,open(os.path.join(R,'data/pages.json'),'w'),indent=1,ensure_ascii=False)
print(len(out),'pages')
