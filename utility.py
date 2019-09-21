import json

with open('datasets/moma_artist_final.json') as json_file:
    data = json.load(json_file)

print(data[0].keys())
print(len(data))

# with open('datasets/compress_color_artwork_final.json') as json_file:
#     data2 = json.load(json_file)
#
# print(data2[0].keys())
# print(len(data2))
# for d in data:
#     acum = 0
#     color = d['Domain color']
#     for c in color:
#         c.append(acum)
#         acum += c[1]
#
# # print(data)
# with open('datasets/compress_color_artwork_final.json','w') as fp:
#     json.dump(data,fp)
