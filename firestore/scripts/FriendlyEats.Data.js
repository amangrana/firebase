/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

FriendlyEats.prototype.addRestaurant = (data) => {
    let collection = firebase.firestore().collection('restaurants');
    return collection.add(data);
};

FriendlyEats.prototype.getAllRestaurants = (render) => {
    let query = firebase.firestore()
        .collection('restaurants')
        .orderBy('avgRating', 'desc')
        .limit(50);
    this.getDocumentsInQuery(query, render);
};

FriendlyEats.prototype.getDocumentsInQuery = (query, render) => {
    query.onSnapshot((snapshot) => {
        if (!snapshot.size) {
            return render();
        }

        snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' || change.type === 'modified') {
                render(change.doc);
            }
        });
    });
};

FriendlyEats.prototype.getRestaurant = (id) => {
    return firebase.firestore().collection('restaurants').doc(id).get();
};

FriendlyEats.prototype.getFilteredRestaurants = (filters, render) => {
    let query = firebase.firestore().collection('restaurants');

    if (filters.category !== 'Any') {
        query = query.where('category', '==', filters.category);
    }

    if (filters.city !== 'Any') {
        query = query.where('city', '==', filters.city);
    }

    if (filters.price !== 'Any') {
        query = query.where('price', '==', filters.price.length);
    }

    if (filters.sort === 'Rating') {
        query = query.orderBy('avgRating', 'desc');
    } else if (filters.sort === 'Reviews') {
        query = query.orderBy('numRatings', 'desc');
    }

    this.getDocumentsInQuery(query, render);
};

FriendlyEats.prototype.addRating = (restaurantID, rating) => {
    let collection = firebase.firestore().collection('restaurants');
    let document = collection.doc(restaurantID);
    let newRatingDocument = document.collection('ratings').doc();

    return firebase.firestore().runTransaction((transaction) => {
        return transaction.get(document).then((doc) => {
            let data = doc.data();

            let newAverage =
                (data.numRatings * data.avgRating + rating.rating) /
                (data.numRatings + 1);

            transaction.update(document, {
                numRatings: data.numRatings + 1,
                avgRating: newAverage
            });
            return transaction.set(newRatingDocument, rating);
        });
    });
};
