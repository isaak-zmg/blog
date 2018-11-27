const Post = require('../lib/mongo').Post
const marked = require('marked')
const CommentModel = require('./comments')


// 将post 的 content 从 markdown 转换为 html
Post.plugin('contentToHtml', {
    afterFind: function (posts) {
        return posts.map(function (post) {
            post.content = marked(post.content)
            return post
        })
    },
    afterFindOne: function (post) {
        if (post) {
            post.content = marked(post.content)
        }
        return post
    }
})

//给post添加留言数 commnetsCount
Post.plugin('addCommentsCount', {
    afterFind: function (post) {
        return Promise.all(post.map(function (post) {
            return CommentModel.getCommentsCount(post._id)
                .then(function (commentsCount) {
                    post.commentsCount = commentsCount
                    return post
                })
        }))
    },
    afterFindOne: function(post){
        if(post){
            return CommentModel.getCommentsCount(post._id).then(function(count){
                post.commentsCount = count
                return post
            })
        }
        return post
    }
})


module.exports = {
    create: function create(post) {
        return Post.create(post).exec()
    },

    getPostById: function getPostById(postId) {
        return Post
            .findOne({ _id: postId })
            .populate({ path: 'author', model: 'User' })
            .addCreatedAt()
            .addCommentsCount()
            .contentToHtml()
            .exec()
    },

    //按创建时间降序获取所有用户文章或者某个特定用户的所有文章
    getPosts: function (author) {
        const query = {}
        if (author) {
            query.author = author
        }
        return Post
            .find(query)
            .populate({ path: 'author', model: "User" })
            .sort({ _id: -1 })
            .addCreatedAt()
            .addCommentsCount()
            .contentToHtml()
            .exec()
    },

    //通过文章id 给 pv + 1
    incPv: function incPv(postId) {
        return Post
            .update({ _id: postId }, { $inc: { pv: 1 } })
            .exec()
    },

    //通过文章id获取一篇原生文章（用于编辑文章）
    getRawPostById: function getRawPostById(postId) {
        return Post
            .findOne({ _id: postId })
            .populate({ path: 'author', model: 'User' })
            .exec()
    },

    //通过文章ID更新一篇文章
    updatePostById: function updatePostById(postId) {
        return Post.update({ _id: postId }, { $SET: data }).exec()
    },

    //通过文章Id删除一篇文章
    delPostById: function delPostById(postId) {
        return Post.deleteOne({ _id: postId })
            .exec()
            .then(function(res){
                //删除文章后再删除留言
                if(res.result.ok && res.result.n>0){
                    return CommentModel.delCommentsByPostId(postId)
                }
            })
    }
}


