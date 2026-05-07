import axios from "axios";

export const testMeal = async () => {
  try {
    const response = await axios.get(
      "https://hufs-clock-api.vercel.app/api/data",
    );
    const meal = response.data.meals;
    console.log(meal[0].menus[0].name);
  } catch (error) {}
};
