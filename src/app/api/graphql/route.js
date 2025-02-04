import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { resolvers } from '@/graphql/resolvers';
import { typeDefs } from '@/graphql/schema';
import { verifyToken } from '@/lib/authMiddleware';

const server = new ApolloServer({
  resolvers,
  typeDefs,
});

const handler = startServerAndCreateNextHandler(server, {
  context: async (req) => {
    // Extract the token from the request headers
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return { user: null };
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const user = await verifyToken(token);
      return { user };
    } catch (error) {
      console.error('Auth error:', error);
      return { user: null };
    }
  },
});

export async function GET(request) {
  return handler(request);
}

export async function POST(request) {
  return handler(request);
}
