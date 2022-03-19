import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {

    // criando variavel que busca as informações do localStorage
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      // json.parse -> transforma de string para o valor original
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const prevCartRef = useRef<Product[]>();

  useEffect(() => {
    prevCartRef.current = cart;
  })

  const cartPreviousValue = prevCartRef.current ?? cart;

  useEffect(() => {
    if (cartPreviousValue !== cart) {
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
      // perpetuar as alterações dentro do carrinho
    }
  }, [cart, cartPreviousValue])









  const addProduct = async (productId: number) => {
    // adiciona o produto ao carrinho
    try {
      const updatedtCart = [...cart];
      // aplicando imutabilidade, não mudando no array cart diretamente mas sim criando uma copia dele e adicionando

      const productExists = updatedtCart.find(product => product.id === productId);
      // verifica se o produto existe ou não

      const stock = await api.get(`/stock/${productId}`);
      // verificação do estoque

      const stockAmount = stock.data.amount;

      const currentAmount = productExists ? productExists.amount : 0;
      // quantidade atual de produtos atual no carrinho
      
      const amount = currentAmount + 1;
      // quantidade desejada atual

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      // verificação do estoque


      if (productExists){
        productExists.amount = amount
        // atualiza a quantidade
      } else{
        const product = await api.get(`/products/${productId}`);

        const newProduct = {
          ...product.data,
          amount: 1
        }
        updatedtCart.push(newProduct);


      }
      // verifica se o produto existe de fato

      setCart(updatedtCart);
     
    } catch {
      toast.error('Error na adição de produto');
      // mostra o erro caso não passar na validação acima

    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedtCart = [...cart];
      const productIndex = updatedtCart.findIndex(product => product.id === productId);

      if (productIndex >= 0) {
        updatedtCart.splice(productIndex, 1);
        setCart(updatedtCart);
        
      } else {
        throw Error();
        // força a mensagem de erro caso caia nessa validação
      }


    } catch {
      toast.error('Error na remoção do produto');
    }
  };
  // remoçao de produtos

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }

      const stock = await api.get(`/stock/${productId}`);

      const stockAmount = stock.data.amount;

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque')
        return;
      }

      const updatedtCart = [...cart];
      const productExists = updatedtCart.find(product => product.id === productId);
      
      if (productExists) {
        productExists.amount = amount;
        setCart(updatedtCart);
       
      } else {
        throw Error();
      }


      // verificação de estoque



    } catch {
      toast.error('Error na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
