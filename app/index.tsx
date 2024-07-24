import { useRootNavigationState, Redirect } from 'expo-router';


export default function InitalRouting() {
  const rootNavigationState = useRootNavigationState();


  if (!rootNavigationState?.key) 
    {
      console.log("rootNavigationState is null");
      return null;
    }

  return <Redirect href={'/(tabs)/index'} />
}

