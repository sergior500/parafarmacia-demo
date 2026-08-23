export function handOffToShopifyCheckout(
  checkoutUrl: string,
  clearCart: () => void,
  navigate: (url: string) => void = (url) => window.location.assign(url),
) {
  clearCart();
  navigate(checkoutUrl);
}
