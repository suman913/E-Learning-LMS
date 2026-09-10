import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const COURSE_PURCHASE_API = `${import.meta.env.VITE_API_BASE_URL}/purchase`;
export const purchaseApi = createApi({
  reducerPath: "purchaseApi",
  baseQuery: fetchBaseQuery({ baseUrl: COURSE_PURCHASE_API }),
  endpoints: (builder) => ({
   createCheckOutSession: builder.mutation({
  query: (data) => {
    const courseId =
      typeof data === "string" ? data : data?.courseId;

    return {
      url: "/checkout/create-checkout-session",
      method: "POST",
      body: { courseId },
      credentials: "include",
    };
  },
}),
    getCourseDetailsWithStatus: builder.query({
      query: (courseId) => ({
        url: `/courses/${courseId}/details-with-status`,
        method: "GET",
        credentials: "include",
      }),
    }),
    getPurchasedCourses: builder.query({
      query: () => ({
        url: "/",
        method: "GET",
        credentials: "include",
      }),
    }),
  }),
});
export const {
  useCreateCheckOutSessionMutation,
  useGetCourseDetailsWithStatusQuery,
  useGetPurchasedCoursesQuery,
} = purchaseApi;
