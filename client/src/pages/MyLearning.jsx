import React from "react";
import Course from "@/pages/Course";
import { useGetMyLearningQuery } from "@/api/courseApi";

const MyLearning = () => {
  const { data, isLoading } = useGetMyLearningQuery();

const myLearning = data?.courses || [];

  return (
    <div className="max-w-4xl mx-auto my-10 px-4 md:px-0">
      <h1 className="font-bold text-2xl">MY LEARNING</h1>
      <div className="my-5">
        {isLoading ? (
          <MyLearningSkeleton /> // Use skeleton loader instead of plain text
        ) : myLearning.length === 0 ? (
          <p className="text-gray-500">
            You are not enrolled in any courses.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {myLearning.map((course) => (
              <Course key={course._id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Skeleton component for loading state
const MyLearningSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
    {[...Array(3)].map((_, index) => (
      <div
        key={index}
        className="bg-gray-300 dark:bg-gray-700 rounded-lg h-40 animate-pulse"
      ></div>
    ))}
  </div>
);

export default MyLearning;
