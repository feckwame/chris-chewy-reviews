/* eslint-disable class-methods-use-this */
/* eslint-disable no-undef */
/* eslint-disable no-console */
/* eslint-disable import/extensions */
import React from 'react';
import styled from 'styled-components';
import ReviewSummary from './ReviewSummary.jsx';
import ReviewPhotos from './ReviewPhotos.jsx';
import ReviewList from './ReviewList.jsx';

const ArticleContainer = styled.article`
  margin-top: 32px;
  margin-left: 196px;
  margin-right: 196px;
  padding: 0px 60px;
`;

const SectionContainer = styled.section`
  margin: 0px 0px 24px;
  padding 55px 24px 16px;
`;

const ReviewListContainer = styled.div`
  float: left;
  width: 80%;
  > h2 {
    font-family: Roboto, sans-serif;
    font-weight: 700;
    font-size: 18px;
    color: #333333;
  }
`;

const ReviewPhotosContainer = styled.div`
  float: right;
  display: inline-block;
  width: 20%;
`;

const axios = require('axios');

const SERVER_URL = 'http://ec2-204-236-154-81.us-west-1.compute.amazonaws.com:3007';

class Reviews extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      reviewData: [],
      reviewSummary: {},
      stars: {},
      reviewPhotos: {},
    };
    this.getReviews = this.getReviews.bind(this);
    this.getReviewSummary = this.getReviewSummary.bind(this);
    this.handleSelect = this.handleSelect.bind(this);
    this.handleGraphSelect = this.handleGraphSelect.bind(this);
    this.filterReviews = this.filterReviews.bind(this);
    this.sortReviews = this.sortReviews.bind(this);
    this.getReviewPhotos = this.getReviewPhotos.bind(this);
  }

  componentDidMount() {
    const parsedUrl = new URL(window.location.href);
    const productId = parsedUrl.searchParams.get('productId');
    this.getReviews(productId);
    this.getReviewSummary(productId);
    this.getReviewPhotos(productId);
  }

  getReviews(productId) {
    const url = `${SERVER_URL}/reviewData/${productId}`;
    axios(url)
      .then((response) => this.setState({ reviewData: response.data }))
      .catch((err) => {
        console.log('Error calling endpoint! ', err);
      });
  }

  getReviewSummary(productId) {
    const url = `${SERVER_URL}/reviewSummary/${productId}`;
    const starObjectForGraph = {};
    axios(url)
      .then((response) => {
        const averageStars = response.data.average_stars;
        const { recommended } = response.data;
        const totalStars = response.data.total_stars;
        const reviewCount = response.data.review_count;
        const product = response.data.product_id;
        let count = 6;
        Object.entries(totalStars).forEach((x) => {
          starObjectForGraph[count -= 1] = Math.round((x[1] / reviewCount) * 100);
        });
        this.setState({
          stars: starObjectForGraph,
        });
        this.setState({
          reviewSummary: {
            averageStars,
            reviewCount,
            recommended,
            totalStars,
            product,
          },
        });
      })
      .catch((err) => {
        console.log('Error calling endpoint! ', err);
      });
  }

  getReviewPhotos(productId) {
    const url = `http://54.67.122.61:3004/review-photos/${productId}`;
    axios(url)
      .then((response) => this.setState({ reviewPhotos: response.data.image_urls }))
      .catch((err) => {
        console.log('Error calling photo endpoint! ', err);
      });
  }

  handleSelect(event) {
    console.log(event.target.id);
    const selectType = event.target.id;
    const val = event.target.value;
    if (selectType === 'filter') {
      this.filterReviews(val);
    } else if (selectType === 'sort') {
      this.sortReviews(val);
    } else {
      throw new Error('Error selecting filter/sort!');
    }
  }

  handleGraphSelect(event) {
    const val = Number(event.target.id);
    this.filterReviews(val);
  }

  filterReviews(starRating) {
    const parsedUrl = new URL(window.location.href);
    const productId = parsedUrl.searchParams.get('productId');
    if (starRating === 'all') {
      this.getReviews(productId);
    } else if (starRating !== '') {
      const url = `${SERVER_URL}/filterReviews/${productId}/${starRating}`;
      axios(url)
        .then((response) => this.setState({ reviewData: response.data }))
        .catch((err) => {
          console.log('Error calling endpoint! ', err);
        });
    }
  }

  sortReviews(sortType) {
    const { reviewData } = this.state;
    switch (sortType) {
      case 'newest': {
        const sortByNewest = reviewData.sort((a, b) => new Date(b.create_date)
          - new Date(a.create_date));
        this.setState({ reviewData: sortByNewest });
        break;
      }
      case 'oldest': {
        const sortByOldest = reviewData.sort((a, b) => new Date(a.create_date)
          - new Date(b.create_date));
        this.setState({ reviewData: sortByOldest });
        break;
      }
      case 'highest_rating': {
        const sortByHighestRating = reviewData.sort((a, b) => b.stars
          - a.stars);
        this.setState({ reviewData: sortByHighestRating });
        break;
      }
      case 'lowest_rating': {
        const sortByLowestRating = reviewData.sort((a, b) => a.stars
          - b.stars);
        this.setState({ reviewData: sortByLowestRating });
        break;
      }
      default:
        throw new Error('Incorrect sort-type!');
    }
  }

  render() {
    const { reviewSummary, reviewData, reviewPhotos } = this.state;
    const { stars } = this.state;

    return (
      <ArticleContainer>
        {
          reviewData.length ? (
            <>
              <ReviewSummary
                summary={reviewSummary}
                allReviews={reviewData}
                stars={stars}
                // eslint-disable-next-line react/jsx-no-bind
                handleGraphSelect={this.handleGraphSelect.bind(this)}
              />
              <SectionContainer>
                <ReviewListContainer>
                  <ReviewList
                    summary={reviewSummary}
                    allReviews={reviewData}
                    // eslint-disable-next-line react/jsx-no-bind
                    handleSelect={this.handleSelect.bind(this)}
                  />
                </ReviewListContainer>
                <ReviewPhotosContainer>
                  <ReviewPhotos
                    allReviews={reviewData}
                    reviewPhotos={reviewPhotos}
                  />
                </ReviewPhotosContainer>
              </SectionContainer>
            </>
          )
            : <div>Loading Reviews...</div>
        }
      </ArticleContainer>
    );
  }
}

export default Reviews;
