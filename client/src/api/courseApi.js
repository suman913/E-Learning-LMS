import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const COURSE_API = `${import.meta.env.VITE_API_BASE_URL}/course`;
export const courseApi = createApi({
  reducerPath: "courseApi",
  tagTypes: ["Course", "Lectures"],
  baseQuery: fetchBaseQuery({
    baseUrl: COURSE_API,
  }),
  endpoints: (builder) => ({
    getAllCourses: builder.query({
      query: () => ({
        url: "/", // Modify here if needed
        method: "GET",
      }),
    }),
    getSearchedCourses: builder.query({
      query: ({ searchQuery, categories, sortByPrice }) => {
        // Build the query string
        let queryString = `/search?query=${encodeURIComponent(searchQuery)}`;

        // Append categories if available
        if (categories && categories.length > 0) {
          const categoriesString = categories.map(encodeURIComponent).join(",");
          queryString += `&categories=${categoriesString}`;
        }

        // Append sortByLevel if available
        
        if (sortByPrice) {
          queryString += `&sortByPrice=${encodeURIComponent(sortByPrice)}`;
        }

        return {
          url: queryString,
          method: "GET",
          credentials: "include",
        };
      },
    }),
    getCreatorCourses: builder.query({
      query: () => ({
        url: "/creator-course",
        method: "GET",
        credentials: "include",
      }),
      providesTags: ["Course"],
    }),
    getMyLearning: builder.query({
  query: () => ({
    url: "/my-learning",
    method: "GET",
    credentials: "include",
  }),
}),
    getCourseById: builder.query({
      query: (courseId) => ({
        url: `/${courseId}`,
        method: "GET",
        credentials: "include",
      }),
    }),
    editCourse: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/edit/${id}`,
        method: "PUT",
        body: formData,
        credentials: "include",
      }),
    }),
    createCourse: builder.mutation({
      query: (formData) => ({
        url: "/create",
        method: "POST",
        body: formData,
        credentials: "include",
      }),
      invalidatesTags: ["Course"],
    }),
    getLecturesByCourseId: builder.query({
      query: (id) => ({
        url: `/${id}/lectures`,
        method: "GET",
        credentials: "include",
      }),
      providesTags: ["Lectures"],
    }),
    getLectureById: builder.query({
      query: (lectureId) => ({
        url: `/lecture/${lectureId}`,
        method: "GET",
        credentials: "include",
      }),
    }),
    createLecture: builder.mutation({
      query: ({ courseId, lectureTitle }) => ({
        url: `/${courseId}/lecture`,
        method: "POST",
        body: { lectureTitle },
        credentials: "include",
      }),
      invalidatesTags: ["Lectures"],
    }),
    editLecture: builder.mutation({
      query: ({ courseId, lectureId, data }) => ({
        url: `/${courseId}/lecture/${lectureId}`,
        method: "POST",
        body: data,
        credentials: "include",
      }),
      invalidatesTags: ["Lectures"],
    }),
    removeLecture: builder.mutation({
      query: (lectureId) => ({
        url: `/lecture/${lectureId}`,
        method: "DELETE",
        credentials: "include",
      }),
      invalidatesTags: ["Lectures"],
    }),
    publishCourse: builder.mutation({
      query: ({ courseId, query }) => ({
        url: `/${courseId}?publish=${query}`,
        method: "PUT",
        credentials: "include",
      }),
      invalidatesTags: ["Course"],
    }),
  }),
});

export const {
  useGetAllCoursesQuery,
  useGetSearchedCoursesQuery,
  useGetCreatorCoursesQuery,
  useGetMyLearningQuery,
  useGetCourseByIdQuery,
  useEditCourseMutation,
  useCreateCourseMutation,
  useGetLectureByIdQuery,
  useCreateLectureMutation,
  useGetLecturesByCourseIdQuery,
  useEditLectureMutation,
  useRemoveLectureMutation,
  usePublishCourseMutation,
} = courseApi;
