const marked = require('marked')
const Comment = require('../lib/mongo').Comment


//将comment的content从markdown 转换成 html
Comment.plugin('contentToHtml',{
    afterFind: function(comments){
        return comments.map(function(comment){
            comment.content = marked(comment.content)
            return comment
        })
    }
})

module.exports = {
    //创建一个留言
    create: function create(comment){
        return Comment.create(comment).exec()
    },

    getCommentById: function getCommentById(commentId){
        return Comment.findOne({_id: commentId}).exec()
    },

    delCommentById: function delCommentById(commentId){
        return Comment.deleteOne({_id: commentId}).exec()
    },

    //删除某ID文章下的所有留言
    delCommentsByPostId: function delCommentsByPostId(postId){
        return Comment.deleteMany({postId: postId}).exec()
    },

    //获取某ID下的所有文章的评论
    getComments: function getComments(postId){
        return Comment
            .find({postId: postId})
            .populate({path: 'author', model: 'User'})
            .sort({_id: 1})
            .addCreatedAt()
            .contentToHtml()
            .exec()
    },

    //通过文章ID获取该文章下留言数
    getCommentsCount: function getCommentsCount(postId){
        return Comment.count({postId:postId}).exec()
    }
}