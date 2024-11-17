import { router } from 'expo-router';
import { KidInfo } from '../types/types';

export const navigateToAddKid = () => {
  router.push({
    pathname: '../itemSubmit/user/addKid'
  });
};
