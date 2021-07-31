import {GraphQLObjectType, GraphQLID, GraphQLString, GraphQLList} from "graphql";

export const UserType = new GraphQLObjectType({
    name: "User",
    fields: () => ({
        id: { type: GraphQLID },
        _id: { type: GraphQLID },
        username: { type: GraphQLString },
        givenName: { type: GraphQLString },
        familyName: { type: GraphQLString },
        email: { type: GraphQLString },
        password: { type: GraphQLString },
        confirmPassword: { type: GraphQLString },
        token: { type: GraphQLString },
    }),
});

export const ColorType = new GraphQLObjectType({
    name: "Color",
    fields: () => ({
        name: {type: GraphQLString},
        value: {type: GraphQLString},
        user: {type: GraphQLString}
    })
})

export const DesignType = new GraphQLObjectType({
    name: "Design",
    fields: () => ({
        name: {type: GraphQLString},
        colors: {type: GraphQLList(GraphQLString)},
        shape: {type: GraphQLString},
        user: {type: GraphQLString}
    })
})
