import numpy as np
import cv2
import requests
import extcolors
import psycopg2
import json
from os import listdir
from os.path import isfile, join

with open('data_s.json', 'r') as data_file:
    jsondata = json.load(data_file)

newjson = list()
count  = 0
for item in jsondata:
    img_id = item['ObjectID']  # object ID of the drawing 
    img_dir= join('MOMA',str(img_id)+'.jpg')
#     print(img_dir)
    img = cv2.imread(img_dir)
    Z = img.reshape((-1,3))
    Z = np.float32(Z)

    # # define criteria, number of clusters(K) and apply kmeans()
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
    K = 8
    ret,label,center=cv2.kmeans(Z,K,None,criteria,10,cv2.KMEANS_RANDOM_CENTERS)

    # # Now convert back into uint8, and make original image
    center = np.uint8(center)
    res = center[label.flatten()]
    res2 = res.reshape((img.shape))
    new_img_dir = join('Kmeans_MOMA',img_dir.split('/')[1])
    cv2.imwrite(new_img_dir,res2)
    
    #save the compressed image 
    
    colors,pixel_count = extcolors.extract(path = new_img_dir,tolerance=10)
    colors = [list(f) for f in colors]
#     print(colors)
    channel = min(8,len(colors))
    dominant_color = colors[:channel]
    max_color=colors[0][0]
#     print(dominant_color)
    sum_pixel = sum([x[1] for x in dominant_color])
    for sub in dominant_color:
        sub[1] = sub[1]/sum_pixel
    item['Domain color'] = dominant_color
    item['Max Color']= max_color
    newjson.append(item)
    count = count+1
    
    if count %100 ==0:
        print('100 is done',count)
    if count %5000 ==0:
         with open(str(count)+'compress_color_artwork.json', 'w') as outfile:  
            json.dump(newjson, outfile,ensure_ascii=False, indent=4)   
  
with open('compress_color_artwork.json', 'w') as outfile:  
    json.dump(newjson, outfile,ensure_ascii=False, indent=4)   
    print('json written')   