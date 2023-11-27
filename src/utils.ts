import Cookies from "universal-cookie";

const cookies = new Cookies();

export const generateRandomString = function(length: number): string {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

export const prepareArtists = (artists: any) => {
  const names = artists.map((item: { name: string; }) => item.name)
  return names.join(", ");
}