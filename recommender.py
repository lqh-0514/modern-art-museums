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

def gram_matrix(feature,M,N):
    F = np.reshape(feature, (M, N))
    G = np.matmul(np.transpose(F), F)
    return G

def layer_difference(feature_a, feature_x):
    _, h, w, d = [i for i in feature_a.shape]
    M = h * w
    N = d
    A = gram_matrix(feature_a, M, N)
    G = gram_matrix(feature_x, M, N)

    total = 0
    for i in range(N):
        for j in range(N):
            total += (A[i][j]-G[i][j])**2
    return total/(4 * (N**2) * (M**2))

def style_feature_method(base_model,tar,cand,k):
    # print("---- EXTRACT STYLE FEATURES FROM IMAGES ----")
    layers_style = ['conv1_1', 'conv2_1', 'conv3_1', 'conv4_1', 'conv5_1']
    layers_name = ['block1_conv1','block2_conv1','block3_conv1','block4_conv1','block5_conv1']

    layers_style_weights = [0.2,0.2,0.2,0.2,0.2]

    def preprocess(img_path):
        img = load_img(img_path, target_size=(224, 224))
        x = img_to_array(img)
        x = np.expand_dims(x, axis=0)
        x = vgg19.preprocess_input(x)
        return x

    ptar = preprocess(tar)

    for i in range(len(layers_name)):
        model = Model(inputs=base_model.input, outputs=base_model.get_layer(layers_name[i]).output)
        feature_a = model.predict(ptar)
        all_loss = [0]*len(cand)

        # print("Extracting style features from "+ layers_name[i])

        for j in range(len(cand)):
            pcand = preprocess(cand[j])
            feature_x = model.predict(pcand)
            loss = layer_difference(feature_a, feature_x)
            all_loss[j] += loss*layers_style_weights[i]

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
    base_model = vgg19.VGG19(weights='imagenet')
    all_images,images_info = load_img_from_folder(folder_path)
    print("number of candidates:")
    print(len(images_info))
    all_paths = convert_name_to_path(folder_path,images_info)
    # path here is in different order than the files in folder, use this order as index for all the following code
    result = {}
    for i in range(len(all_images)):
        print(i)
        image_name = images_info[i]['name']+'.jpg'
        print("running cnn on "+image_name)
        image_path = folder_path + "/" + image_name
        tar_image = load_single_img(image_path)

        idx_loss = style_feature_method(base_model,image_path,all_paths,k)

        style_cand = []

        for j in range(k):
            style_cand.append(images_info[idx_loss[j]]['name'])

        print(style_cand)
        # neighbors = []
        # neighbors.append(style_cand)
        result[images_info[i]['name']] = style_cand
        print(result)

    print("SAVING RESULT")
    print(len(result))

    # write results to a json file
    with open('recommender_result.json','w') as fp:
        json.dump(result,fp)

    print('file written as recommender_result.json')

if __name__ == "__main__":
    folder_path = "test_MOMA" #folder name where all the images are stored
    k = 11 #number of recommendations + 1
    plot_neighbors(folder_path,k)
