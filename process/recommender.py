import keras
import tensorflow as tf
import numpy as np
from keras.applications import vgg16, vgg19, inception_v3, resnet50, mobilenet
from keras.preprocessing.image import load_img, img_to_array, array_to_img
from keras import backend as K
from keras.models import Model
import json
import os
from scipy import spatial
import pickle
from sklearn.decomposition import PCA



def gram_matrix(feature,M,N):
    F = tf.reshape(feature, (M, N))
    G = tf.matmul(tf.transpose(F), F)
    
    return G

def layer_difference(feature_a, feature_x):
    _, h, w, d = feature_a.get_shape().as_list()
    M = h * w
    # print('M',type(M))
    N = d
    A = gram_matrix(feature_a, M, N)
    G = gram_matrix(feature_x, M, N)

    return A,G,M,N



def preprocess(img_path):
    img = load_img(img_path, target_size=(224, 224))
    x = img_to_array(img)
    x = np.expand_dims(x, axis=0)
    x = vgg19.preprocess_input(x)
    return x

def style_feature_method(base_model,tar,layers_name):
    # print("---- EXTRACT STYLE FEATURES FROM IMAGES ----")


    # style_list = []

    ptar = preprocess(tar)

    
    # model = Model(inputs=base_model.input, outputs=base_model.get_layer(layers_name[i]).output)
    feature_a = base_model.predict(ptar)
    print(type(feature_a))
    # print(feature_a.shape)
    # style_list.append(feature_a)

    return feature_a

def img_difference(all_images,images_info,image_feature,own_feature,layers_style_weights):

    all_loss = [0]*len(images_info)

    # print("Extracting style features from "+ layers_name[i])
    with tf.Session() as sess:
        for j in range(len(images_info)):
            feature_x = image_feature[images_info[j]['name']]
            # pca = PCA(n_components=2,copy = False)
            # temp1 = tf.reshape(own_feature[index],[2,-1])
            # pca.fit(temp1)  
            # own_feature_new = pca.fit_transform(temp1)
            # temp2 = tf.reshape(feature_x[index],[2,-1])
            # pca.fit(temp2)
            # new_feature_x = pca.fit_transform(temp2)
            a = tf.convert_to_tensor(own_feature)
            x = tf.convert_to_tensor(feature_x)
            # print(x.dtype)
            # A,G,M,N = layer_difference(a,x)
            # print('second M',M.shape)
            # loss = sess.run((1./(4 * (M**2) * (N**2))) * tf.reduce_sum(tf.square(G - A)))
            tensor= tf.math.subtract(own_feature,feature_x,name = None)
            loss = tf.norm(tensor, ord='euclidean')
            # loss = sess.run(tf.reduce_sum((tf.sqrt(tf.reduce_sum(tf.square(a-x), 2)))))
            # print(loss,'second loss')
            all_loss[j] += loss.eval()
    loss_array = np.array(all_loss)
    idx_loss = np.argsort(loss_array)[:k]
    return idx_loss

def img_difference(all_images,images_info,image_feature,own_feature,layers_style_weights):

    all_loss = [0]*len(images_info)

    # print("Extracting style features from "+ layers_name[i])
    # with tf.Session() as sess:
    for j in range(len(images_info)):
        feature_x = image_feature[images_info[j]['name']]
        # pca = PCA(n_components=2,copy = False)
        # temp1 = tf.reshape(own_feature[index],[2,-1])
        # pca.fit(temp1)  
        # own_feature_new = pca.fit_transform(temp1)
        # temp2 = tf.reshape(feature_x[index],[2,-1])
        # pca.fit(temp2)
        # new_feature_x = pca.fit_transform(temp2)
        a = tf.convert_to_tensor(own_feature)
        x = tf.convert_to_tensor(feature_x)
        # print(x.dtype)
        # A,G,M,N = layer_difference(a,x)
        # print('second M',M.shape)
        # loss = sess.run((1./(4 * (M**2) * (N**2))) * tf.reduce_sum(tf.square(G - A)))
        tensor= tf.math.subtract(own_feature,feature_x,name = None)
        loss = tf.norm(tensor, ord='euclidean')
        # loss = sess.run(tf.reduce_sum((tf.sqrt(tf.reduce_sum(tf.square(a-x), 2)))))
        # print(loss,'second loss')
        all_loss[j] += loss.eval()
    loss_array = np.array(all_loss)
    idx_loss = np.argsort(loss_array)[:k]
    return idx_loss

def load_img_from_folder(folder_path):
    print("---- LOAD ALL IMAGES FROM FOLDER ----")
    all_images = []
    images_info = []
    for img in os.listdir(folder_path):
        if img.split('.')[1] == 'jpg':
            name = img.split('.')[0]
            temp = {}
            temp['name'] = name
            images_info.append(temp)
            img = load_img(folder_path + '/' + img, target_size=(224, 224))
            img = img_to_array(img)
            # img = np.expand_dims(img, axis=0)
            all_images.append(img)
    return all_images,images_info

def convert_name_to_path(folder_path,images_info):
    images_path = []
    # images_name = []
    # for img in os.listdir(folder_path):
    #     if img.split('.')[1] == 'jpg':
    #         path = folder_path + '/' + img
    #         images_path.append(path)
            # images_name.append(img)
    for img in images_info:
        path = folder_path + '/' + img['name'] + '.jpg'
        images_path.append(path)
    # print(images_path)
    return images_path

def load_single_img(path):
    """
    Return the numpy array of an image load from given path
    """
    # load an image in PIL format
    original = load_img(path, target_size=(224, 224))
    # convert the PIL image to a numpy array
    numpy_image_test = img_to_array(original)
    return numpy_image_test

def plot_neighbors(folder_path,k):
    base_model = vgg19.VGG19(weights='imagenet',include_top=False)
    all_images,images_info = load_img_from_folder(folder_path)
    print("number of candidates:")
    print(len(images_info))
    all_paths = convert_name_to_path(folder_path,images_info)

    # define extract layer 
    layers_style = ['conv5_1']#'conv1_1', 'conv2_1', 'conv3_1', 'conv4_1', 
    layers_name = ['block5_conv1'] #'block1_conv1','block2_conv1','block3_conv1','block4_conv1',

    layers_style_weights = [1]

    # path here is in different order than the files in folder, use this order as index for all the following code
    result = {}
    image_feature = dict()




    for i in range(len(all_images)):
        # print(i)
        image_name = images_info[i]['name']+'.jpg'
        print("running cnn on "+image_name)
        image_path = folder_path + "/" + image_name
        # tar_image = load_single_img(image_path)
        image_feature[images_info[i]['name']] = style_feature_method(base_model,image_path,layers_name)
        # idx_loss = style_feature_method(base_model,image_path,all_paths,k)
    # distance_dict = dict()  # distance to all other 
    with open('filename.pickle', 'wb') as handle:
        pickle.dump(image_feature, handle, protocol=pickle.HIGHEST_PROTOCOL)

    # for j in range(len(all_images)):
    #     print('start running distance on ',images_info[j]['name'])

    #     own_feature = image_feature[images_info[j]['name']]
    #     img_info_index=img_difference(all_images,images_info,image_feature,own_feature,layers_style_weights)
    #     result_list  = []
    #     for item in img_info_index:
    #         result_list.append(images_info[item])
    #     result[images_info[j]['name']] = result_list
    #     print('finish running distance on ',images_info[j]['name'])
    #     if j%50 == 0 :
    #         with open(str(j)+'recommender_result.json','w') as fp:
    #             json.dump(result,fp)
    # print("SAVING RESULT")
    # print(len(result))

    # # write results to a json file
    # with open('recommender_result.json','w') as fp:
    #     json.dump(result,fp)

    print('file written as recommender_result.json')

if __name__ == "__main__":
    folder_path = "Kmeans_MOMA" #folder name where all the images are stored
    k = 11 #number of recommendations + 1
    plot_neighbors(folder_path,k)
