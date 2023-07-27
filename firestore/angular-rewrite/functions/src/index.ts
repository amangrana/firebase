/**
 * Copyright 2023 Google LLC
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

import {
    onDocumentWritten,
} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp } from "firebase-admin/app";

import { Restaurant } from '../../types/restaurant';
import { Rating } from '../../types/ratings';

initializeApp();
const db = getFirestore();

export const updateNumRatings = onDocumentWritten(
    "restaurants/{restaurtantID}/ratings/{ratingID}", async (event) => {
        logger.info(
            `Updatuing the numRatings and avgRatings for restuarant
             ${event.params.restaurtantID}`);

        // Get num reviews from restaurant and compare to actual num reviews
        const restuarantDocRef = db.doc(
            `restaurants/${event.params.restaurtantID}`);
        logger.info(`Fetching data for restaurant 
                    ${event.params.restaurtantID}`);

        const restaurantDocFromFirebase = await restuarantDocRef.get();
        const restaurantData = restaurantDocFromFirebase.data() as Restaurant;
        const numRatingsReported = restaurantData.numRatings;
        const fetchedRatingDocs = await db.collection(`restaurants/${event.params.restaurtantID}/ratings`).get()
        const actualRatings: Rating[] = []
        fetchedRatingDocs.forEach(rating => actualRatings.push(rating.data() as Rating))


        // Finally, do all our checks
        if (numRatingsReported !== actualRatings.length) {
            // Calculate average review
            let sumOfRatings = 0;
            actualRatings.forEach(currentRating => sumOfRatings += currentRating.rating)
            const newAvgRating = Math.round(sumOfRatings / actualRatings.length);
            const newRestaurant: Restaurant = {
                ...restaurantData,
                avgRating: newAvgRating,
                numRatings: actualRatings.length
            }

            // Save result to Firestore
            return restuarantDocRef.set(newRestaurant)
        }

        // Returns null if document already accounted for
        return;
    }
)

